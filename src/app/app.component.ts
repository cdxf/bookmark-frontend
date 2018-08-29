import {Component} from '@angular/core';
import {PostService} from './post.service';
import {Category, Post} from './Model';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {FormPostComponent} from './form-post/form-post.component';
import {Subject} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'frontend';
  showEdit: boolean;
  profileForm: FormGroup;
  posts: Category[];
  $saveChange = new Subject();

  getPosts(cat_index: number): FormArray {
    const posts = (this.profileForm.get('categories') as FormArray)
      .at(cat_index).get('posts') as FormArray;
    return posts;
  }
  getNotDeletedPost(posts) {
    return posts.filter(it => !it.deleted);
  }
  getFirstPost(cat_index: number) {
    return this.getPosts(cat_index).at(0);
  }
  getLastPost(cat_index: number) {
    const posts = this.getPosts(cat_index);
    return posts.at(posts.length - 1);
  }
  get categories() {
    const categories = this.profileForm.get('categories') as FormArray;
    return categories;
  }
  delete(element: AbstractControl) {
    element.get('deleted').setValue(true);
    console.log(event);
  }
  toggleEditPannel() {
    this.showEdit = !this.showEdit;
  }
  move(currentPost: AbstractControl, up: boolean ) {
    const id = currentPost.get('id').value;
    const cats = this.categories.value as Category[];
    let found = false;
    for (let cat_index = 0; cat_index < cats.length; cat_index++) {
      if (found) { return; }
      for (let post_index = 0; post_index < cats[cat_index].posts.length; post_index++) {
        if (id === cats[cat_index].posts[post_index].id) {
          if (up) {
            if (post_index === 0) { return; }
            const first_post = this.getFirstPost(cat_index).get('order');
            currentPost.patchValue({order: first_post.value - 1});
          } else {
            const last_post = this.getLastPost(cat_index);
            const last_post_index = last_post.get('order').value;
            if (post_index === cats[cat_index].posts.length - 1 ) { return; }
            currentPost.patchValue({order: last_post_index + 1});
          }
          found = true;
          break;
        } else {  }
      }
    }
  }
  checkTwoSort(arr1: Post[], arr2: Post[]) {
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i].order !== arr2[i].order) {
        return true;
      }
    }
    return false;
  }
  public submit() {
    this.postService.changed(this.profileForm.get('categories').value).subscribe((categories: Category[]) => {
      this.init(categories);
      this.$saveChange.next();
    });
  }
  public init(categories: Category[]) {
    {
      categories.sort((a, b) => a.order - b.order);
      let order = 0;
      categories.forEach(cat => {
        cat.order = order;
        order++;
        let post_order = 0;
        cat.posts.forEach(post => {
          post.order = post_order;
          post_order++;
        });
      });
      this.posts = categories;
      const formArray = new FormArray(categories.map((cat) => {
        return this.fb.group(
          {
            id: [cat.id],
            name: [cat.name],
            description: [cat.description],
            posts: this.fb.array(cat.posts.map((post) => {
              return FormPostComponent.build(post, this.fb);
            }))
          });
      }));
      this.profileForm = this.fb.group({categories: formArray});
      this.profileForm.valueChanges.subscribe(e => {
        console.log(e);
        e['categories'].map((cat, catIndex) => {
          console.log(cat.posts);
          const sorted = ([...cat.posts] as Post[])
            .sort((a, b) => a.order - b.order);
          if (this.checkTwoSort(sorted, cat.posts)) {
            setTimeout(() => {
              (this.profileForm
                .get('categories') as FormArray)
                .at(catIndex)
                .get('posts').setValue(sorted);

            }, 0);
            //   .setValue(sorted);
          }
        });
      });
    }
  }
  constructor(private fb: FormBuilder, private postService: PostService) {
    this.postService.getPosts().subscribe((categories: Category[]) => this.init(categories));
  }
}
